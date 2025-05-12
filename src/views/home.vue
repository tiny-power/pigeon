<template>
    <div class="flex-container" :style="{ height: clientHeight + 'px' }">
        <div
            style="
                width: 281px;
                border: 1px solid #d7dae2;
                font-size: 12px;
                border-radius: 8px;
                padding: 0px 8px 12px 8px;
                box-sizing: border-box;
            "
        >
            <div style="margin-top: 15px" v-if="profiles.length != 0 && !profileVisible">
                <el-table
                    ref="profileTable"
                    :data="profiles"
                    style="border-radius: 8px; border: 1px solid #272727"
                    :show-header="false"
                    highlight-current-row
                    @row-dblclick="profileRowClick"
                    max-height="575"
                >
                    <el-table-column prop="name" show-overflow-tooltip>
                        <template slot-scope="scope">
                            <div>
                                <div style="color: #272727">{{ scope.row.name }}</div>
                                <div style="font-size: 12px">{{ accountType[scope.row.type] }}</div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column width="86">
                        <template slot-scope="scope">
                            <el-button
                                type="primary"
                                size="mini"
                                icon="el-icon-edit"
                                circle
                                @click="handleProfileEdit(scope.$index)"
                            ></el-button>
                            <el-button
                                size="mini"
                                icon="el-icon-delete"
                                circle
                                @click="handleProfileDelete(scope.$index)"
                            ></el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div style="margin-top: 15px">
                <el-button type="primary" size="small" v-if="!profileVisible" @click="handleCreateProfile"
                    >Add New Account</el-button
                >
            </div>
            <el-form
                ref="profile"
                :rules="profileRules"
                :model="profileForm"
                label-position="top"
                size="medium"
                v-if="profileVisible"
            >
                <el-form-item label="Dispaly Name" prop="name" style="margin-top: -10px">
                    <el-input v-model="profileForm.name" placeholder="Dispaly Name"></el-input>
                </el-form-item>
                <el-form-item label="Account Type" prop="type">
                    <el-select
                        v-model="profileForm.type"
                        placeholder="Account Type"
                        :popper-append-to-body="false"
                        @change="handleType"
                    >
                        <el-option label="MinIO" value="minio"></el-option>
                        <el-option label="Amazon S3" value="aws"></el-option>
                        <el-option label="Backblaze B2" value="b2"></el-option>
                        <el-option label="CloudFlare R2" value="r2"></el-option>
                        <el-option label="Alibaba Cloud OSS" value="oss"></el-option>
                        <el-option label="Tencent COS" value="cos"></el-option>
                        <el-option label="Other" value="other"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item
                    label="EndPoint"
                    prop="endPoint"
                    v-if="
                        profileForm.type === 'minio' ||
                        profileForm.type === 'oss' ||
                        profileForm.type === 'cos' ||
                        profileForm.type === 'b2' ||
                        profileForm.type === 'r2' ||
                        profileForm.type === 'other'
                    "
                >
                    <el-input
                        v-model="profileForm.endPoint"
                        placeholder="EndPoint is a host name or an IP address"
                    ></el-input>
                </el-form-item>
                <el-form-item
                    label="Port"
                    prop="port"
                    v-if="profileForm.type === 'minio' || profileForm.type === 'other'"
                >
                    <el-input v-model="profileForm.port" placeholder="Port"></el-input>
                </el-form-item>
                <el-form-item label="Access Key ID" prop="accessKey">
                    <el-input v-model="profileForm.accessKey" placeholder="Access Key ID"></el-input>
                </el-form-item>
                <el-form-item label="Secret Access Key" prop="secretKey">
                    <el-input
                        type="password"
                        v-model="profileForm.secretKey"
                        placeholder="Secret Access Key"
                        show-password
                    ></el-input>
                </el-form-item>
                <el-form-item
                    label="Use secure transfer(SSL/TLS)"
                    v-if="profileForm.type === 'minio' || profileForm.type === 'other'"
                >
                    <el-switch v-model="profileForm.useSSL"></el-switch>
                </el-form-item>
                <el-form-item label="Path Style" v-if="profileForm.type === 'other'">
                    <el-switch v-model="profileForm.pathStyle"></el-switch>
                </el-form-item>
                <el-form-item style="margin-top: 15px">
                    <el-button size="small" @click="profileVisible = false">Cancel</el-button>
                    <el-button type="primary" size="small" @click="saveProfile">Save Account</el-button>
                </el-form-item>
            </el-form>
        </div>
        <div style="flex: 1; display: flex; justify-content: center; align-items: center; flex-direction: column">
            <div class="profile" v-if="!client">
                <div>
                    <i class="el-icon-cloudy" style="font-size: 48px"></i>
                </div>
                <div style="font-size: 18px; color: #272727; margin: 15px 0px 5px 0px; font-weight: bold">
                    {{ $t('title') }}
                </div>

                <div style="font-size: 14px; margin-top: 5px; color: #606266; width: 405px; text-align: center">
                    {{ $t('subtitle') }}
                </div>
                <div style="margin-top: 25px">
                    <el-button type="primary" size="small" @click.stop="handleCreateProfile">Add New Account</el-button>
                    <el-button size="small" @click.stop="handleSelectProfile">Select Account</el-button>
                </div>
            </div>
            <div v-else style="width: 870px; height: 650px">
                <div style="margin-top: 6px; margin-bottom: 12px">
                    <el-breadcrumb separator="/">
                        <el-breadcrumb-item><span @click="listBuckets">Buckets</span></el-breadcrumb-item>
                        <el-breadcrumb-item v-if="currentBucketName"
                            ><span @click="jumpRoot">{{ currentBucketName }}</span></el-breadcrumb-item
                        >
                        <el-breadcrumb-item
                            v-for="(item, index) in currentPrefix
                                .split('/')
                                .slice(0, currentPrefix.split('/').length - 1)"
                            :key="index"
                            ><span @click="jumpPath(index)">{{ item }}</span></el-breadcrumb-item
                        >
                    </el-breadcrumb>
                </div>
                <div style="margin-bottom: 12px">
                    <el-button type="primary" size="small" @click="showNewBucket" v-if="!currentBucketName"
                        >New Bucket</el-button
                    >
                    <el-button type="primary" size="small" v-if="currentBucketName" @click="handleUpload"
                        >Upload</el-button
                    >
                    <el-button size="small" v-if="currentBucketName" @click="showNewFolder">New Folder</el-button>
                    <el-button
                        size="small"
                        v-if="currentBucketName && multipleSelection.length != 0"
                        @click="handleDownload"
                        >Download</el-button
                    >
                    <el-button
                        size="small"
                        @click="handleDelete"
                        v-if="currentBucketName && multipleSelection.length != 0"
                        >Delete</el-button
                    >
                    <el-button
                        size="small"
                        @click="handleShare"
                        v-if="currentBucketName && multipleSelection.length == 1 && this.multipleSelection[0].name"
                        >Share</el-button
                    >
                </div>
                <el-table
                    ref="multipleTable"
                    :data="tableData"
                    style="width: 100%; border-radius: 8px"
                    height="575"
                    @selection-change="handleSelectionChange"
                    @row-contextmenu="rowContextmenu"
                    highlight-current-row
                    highlight-selection-row
                    empty-text=" "
                    @row-click="bucketRowClick"
                >
                    <el-table-column type="selection" width="45" align="center" v-if="currentBucketName">
                    </el-table-column>
                    <el-table-column prop="name" label="Name" :sortable="currentBucketName != ''" show-overflow-tooltip>
                        <template slot-scope="scope">
                            <div style="display: flex; align-items: center">
                                <div style="display: flex; align-items: center" v-html="formatterIcon(scope.row)"></div>
                                <div v-html="formatterName(scope.row)"></div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column
                        prop="last_modified"
                        label="Last Modified"
                        width="180"
                        :sortable="currentBucketName != ''"
                        :formatter="formatterLastModified"
                    >
                    </el-table-column>
                    <el-table-column
                        prop="size"
                        label="Size"
                        width="100"
                        :sortable="currentBucketName != ''"
                        :formatter="formatterSize"
                    >
                    </el-table-column>
                </el-table>
            </div>
        </div>
        <el-dialog title="Activate License" :visible.sync="licenseVisible" width="436px" center>
            <el-form label-position="top" size="medium">
                <el-form-item label="">
                    <el-input placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" v-model="licenseKey" clearable>
                    </el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button type="primary" size="medium" @click="handleActivate" :disabled="licenseKey === ''"
                    >Activate</el-button
                >
            </span>
        </el-dialog>
        <el-dialog title="Create New Bucket" :visible.sync="bucketVisible" width="436px">
            <el-form label-position="top" size="medium">
                <el-form-item label="Bucket Name">
                    <el-input v-model="bucketName" placeholder="Enter bucket name"> </el-input>
                </el-form-item>
                <div style="margin-top: 8px; font-size: 12px; color: #909399">
                    Bucket names must be between 3-63 characters and can only contain lowercase letters, numbers, dots
                    and hyphens
                </div>
                <el-form-item label="Access Policy">
                    <el-select v-model="policy" placeholder="Access Policy" :popper-append-to-body="false">
                        <el-option label="Private" value="Private"></el-option>
                        <el-option label="Public" value="Public"></el-option>
                        <!-- <el-option label="Custom" value="Custom"></el-option> -->
                    </el-select>
                </el-form-item>
                <el-form-item label="Action Resource" v-if="policy === 'Custom'">
                    <el-select
                        v-model="actionList"
                        placeholder="Action Resource"
                        :popper-append-to-body="false"
                        multiple
                    >
                        <!-- Bucket -->
                        <el-option label="CreateBucket" value="s3:CreateBucket"></el-option>
                        <el-option label="DeleteBucket" value="s3:DeleteBucket"></el-option>
                        <el-option label="ListBucket" value="s3:ListBucket"></el-option>
                        <el-option label="GetBucketLocation" value="s3:GetBucketLocation"></el-option>
                        <el-option label="ListBucketMultipartUploads" value="s3:ListBucketMultipartUploads"></el-option>
                        <!-- Object -->
                        <el-option label="GetObject" value="s3:GetObject"></el-option>
                        <el-option label="PutObject" value="s3:PutObject"></el-option>
                        <el-option label="DeleteObject" value="s3:DeleteObject"></el-option>
                        <el-option label="AbortMultipartUpload" value="s3:AbortMultipartUpload"></el-option>
                        <el-option label="ListMultipartUploadParts" value="s3:ListMultipartUploadParts"></el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button size="medium" @click="bucketVisible = false">Cancel</el-button>
                <el-button type="primary" size="medium" @click="handleNewBucket" :disabled="bucketName === ''"
                    >New Bucket</el-button
                >
            </span>
        </el-dialog>
        <el-dialog title="Change Access Policy" :visible.sync="policyVisible" width="436px">
            <el-form label-position="top" size="medium">
                <el-form-item label="Access Policy">
                    <el-select v-model="policy" placeholder="Access Policy" :popper-append-to-body="false">
                        <el-option label="Private" value="Private"></el-option>
                        <el-option label="Public" value="Public"></el-option>
                        <el-option label="Custom" value="Custom"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="Action Resource" v-if="policy === 'Custom'">
                    <el-select
                        v-model="actionList"
                        placeholder="Action Resource"
                        :popper-append-to-body="false"
                        multiple
                    >
                        <!-- Bucket -->
                        <el-option label="CreateBucket" value="s3:CreateBucket"></el-option>
                        <el-option label="DeleteBucket" value="s3:DeleteBucket"></el-option>
                        <el-option label="ListBucket" value="s3:ListBucket"></el-option>
                        <el-option label="GetBucketLocation" value="s3:GetBucketLocation"></el-option>
                        <el-option label="ListBucketMultipartUploads" value="s3:ListBucketMultipartUploads"></el-option>
                        <!-- Object -->
                        <el-option label="GetObject" value="s3:GetObject"></el-option>
                        <el-option label="PutObject" value="s3:PutObject"></el-option>
                        <el-option label="DeleteObject" value="s3:DeleteObject"></el-option>
                        <el-option label="AbortMultipartUpload" value="s3:AbortMultipartUpload"></el-option>
                        <el-option label="ListMultipartUploadParts" value="s3:ListMultipartUploadParts"></el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button size="medium" @click="policyVisible = false">Cancel</el-button>
                <el-button type="primary" size="medium" @click="setPolicy">Set</el-button>
            </span>
        </el-dialog>
        <el-dialog title="Create New Folder" :visible.sync="folderVisible" width="438px">
            <el-form label-position="top" size="medium">
                <el-form-item label="Folder Name">
                    <el-input v-model="folderName" placeholder="Enter folder name"> </el-input>
                </el-form-item>
                <div style="margin-top: 8px; font-size: 12px; color: #909399">
                    Folder names can contain letters, numbers, hyphens and underscores
                </div>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button size="medium" @click="folderVisible = false">Cancel</el-button>
                <el-button type="primary" size="medium" @click="handleNewFolder" :disabled="folderName === ''"
                    >Create Folder</el-button
                >
            </span>
        </el-dialog>
        <el-dialog title="Delete Bucket" :visible.sync="confirmVisible" width="436px">
            <el-form label-position="top" size="medium">
                <div>Are you sure you want to dekete the bucket {{ '"' + deleteBucketName + '"' }}?</div>
                <el-form-item label='Type "DELETE" to confirm:'>
                    <el-input v-model="deleteWord" placeholder="DELETE"> </el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button size="medium" @click="confirmVisible = false">Cancel</el-button>
                <el-button type="primary" size="medium" @click="handleDeleteBucket" :disabled="deleteWord != 'DELETE'"
                    >Delete Bucket</el-button
                >
            </span>
        </el-dialog>
        <el-dialog title="Delete Non-Empty Bucket" :visible.sync="deleteBucketVisible" width="436px">
            <el-form label-position="top" size="medium">
                <div>
                    The bucket {{ '"' + deleteBucketName + '"' }} is not empty. Deleting it will permanently remove all
                    files and folders inside it. This action cannot be undone.
                </div>
                <el-form-item label='Type "DELETE" to confirm:'>
                    <el-input v-model="deleteWord" placeholder="DELETE"> </el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button size="medium" @click="deleteBucketVisible = false">Cancel</el-button>
                <el-button
                    type="primary"
                    size="medium"
                    :disabled="deleteWord != 'DELETE'"
                    @click="handleDeleteEverything"
                    >Delete Everything</el-button
                >
            </span>
        </el-dialog>
        <div id="menu" style="display: none; position: absolute">
            <el-cascader-panel
                v-model="panelValue"
                :options="menuOptions"
                @change="menuChange"
                :props="{ expandTrigger: 'hover', emitPath: false }"
                size="small"
            ></el-cascader-panel>
        </div>
        <div class="el-notification right" style="bottom: 16px; z-index: 2003" v-show="progressVisible">
            <div class="el-notification__group">
                <h2 class="el-notification__title">{{ notificationTitle }}</h2>
                <div class="el-notification__content" style="margin-top: 16px; width: 300px">
                    <el-progress :percentage="percentage"></el-progress>
                    <p style="margin-top: 12px; margin-bottom: 8px">Total remaining: {{ remainingNumber }} file</p>
                </div>
                <div class="el-notification__closeBtn el-icon-close" @click="progressVisible = false"></div>
            </div>
        </div>
    </div>
</template>

<script>
const fs = require('fs')
const mime = require('mime')
const path = require('path')
import { ClientJS } from 'clientjs'
import * as Minio from 'minio'
const dayjs = require('dayjs')
import pLimit from 'p-limit'
const AdmZip = require('adm-zip')
export default {
    data() {
        return {
            clientHeight: document.documentElement.clientHeight || document.body.clientHeight,
            isPay: true,
            licenseVisible: false,
            licenseKey: '',
            client: null,
            appPath: '',
            profiles: [],
            profileForm: {
                type: '',
                name: '',
                endPoint: '',
                port: '',
                accessKey: '',
                secretKey: '',
                region: '',
                useSSL: false,
                pathStyle: true
            },
            tableData: [],
            multipleSelection: [],
            profileVisible: false,
            profileRules: {
                type: [{ required: true, message: 'Account Type', trigger: 'change' }],
                name: [{ required: true, message: 'Display Name', trigger: 'blur' }],
                endPoint: [{ required: true, message: 'EndPoint', trigger: 'blur' }],
                port: [{ required: true, message: 'Port', trigger: 'blur' }],
                accessKey: [{ required: true, message: 'Access Key ID', trigger: 'blur' }],
                secretKey: [{ required: true, message: 'Secret Access Key', trigger: 'blur' }],
                region: [{ required: true, message: 'Region', trigger: 'blur' }]
            },
            currentBucketName: '',
            currentPrefix: '',
            currentIndex: -1,
            bucketVisible: false,
            bucketName: '',
            policy: 'Private',
            policyVisible: false,
            folderVisible: false,
            folderName: '',
            actionList: [],
            confirmVisible: false,
            deleteBucketName: '',
            deleteWord: '',
            deleteBucketVisible: false,
            menuOptions: [],
            panelValue: '',
            currentRow: {},
            downloadDir: '',
            limit: null,
            notificationTitle: '',
            progressVisible: false,
            percentage: 0,
            totalNumber: 0,
            remainingNumber: 0,
            accountType: {
                minio: 'MinIO',
                aws: 'Amazon S3',
                b2: 'Backblaze B2',
                r2: 'CloudFlare R2',
                oss: 'Alibaba Cloud OSS',
                cos: 'Tencent COS',
                azure: 'Azure Blob',
                google: 'Google Cloud Storage',
                obs: 'Huawei OBS',
                other: 'Other'
            }
        }
    },
    mounted() {
        this.limit = pLimit(10)
        this.isPay = localStorage.getItem('isPay') || false
        this.profiles = JSON.parse(localStorage.getItem('profiles') || '[]')
        document.addEventListener('click', this.bodyCloseMenu)
        // document.getElementById('drop').addEventListener('dragover', event => {
        //     event.preventDefault()
        // })
        // document.getElementById('drop').addEventListener('drop', async event => {
        //     event.preventDefault()
        //     if (this.currentBucketName) {
        //         let appPath = await window.ipcRenderer.invoke('getAppPath')
        //         const files = event.dataTransfer.files
        //         let filesData = []
        //         for (let i = 0; i < files.length; i++) {
        //             this.walkDir(files[i].path, '', filesData, appPath.appPath)
        //         }
        //         this.notificationTitle = 'Uploads'
        //         this.progressVisible = true
        //         this.totalNumber = filesData.length
        //         this.remainingNumber = filesData.length
        //         this.percentage = 0
        //         await Promise.all(filesData)
        //         this.listObjects(this.currentBucketName, this.currentPrefix)
        //         this.progressVisible = false
        //         console.log('success')
        //     }
        // })
    },
    beforeDestroy() {
        document.removeEventListener('click', this.bodyCloseMenu)
    },
    methods: {
        bodyCloseMenu(event) {
            let menu = document.getElementById('menu')
            if (menu.style.display === 'block') {
                menu.style.display = 'none'
            }
        },
        async listBuckets() {
            try {
                const buckets = await this.client.listBuckets()
                this.tableData = buckets
                this.currentBucketName = ''
                this.currentPrefix = ''
            } catch (err) {
                this.$message.error(err.message)
            }
        },
        async makeBucket(bucketName, policy) {
            try {
                const exists = await this.client.bucketExists(bucketName)
                if (exists) {
                    this.$message.error('Bucket exists.')
                } else {
                    await this.client.makeBucket(bucketName)
                    this.setBucketPolicy(bucketName, policy)
                    this.bucketVisible = false
                    this.listBuckets()
                }
            } catch (err) {
                this.$message.error(err.message)
            }
        },
        async copyObject(targetBucketName, targetObjectName, sourceBucketNameAndObjectName) {
            try {
                await this.client.copyObject(targetBucketName, targetObjectName, sourceBucketNameAndObjectName)
            } catch (err) {
                this.$message.error(err.message)
            }
        },
        async getBucketPolicy(bucketName) {
            try {
                const policy = await this.client.getBucketPolicy(bucketName)
                console.log(JSON.parse(policy))
            } catch (err) {
                this.$message.error(err.message)
            }
        },
        async setBucketPolicy(bucketName, policy) {
            if (this.profiles[this.currentIndex].type === 'r2') {
            } else {
                if (policy == 'Public') {
                    // Public
                    let bucketAction = ['s3:GetBucketLocation', 's3:ListBucket', 's3:ListBucketMultipartUploads']
                    let objectAction = [
                        's3:AbortMultipartUpload',
                        's3:DeleteObject',
                        's3:GetObject',
                        's3:ListMultipartUploadParts',
                        's3:PutObject'
                    ]
                    policy = {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Principal: { AWS: ['*'] },
                                Action: bucketAction,
                                Resource: ['arn:aws:s3:::' + bucketName]
                            },
                            {
                                Effect: 'Allow',
                                Principal: { AWS: ['*'] },
                                Action: objectAction,
                                Resource: ['arn:aws:s3:::' + bucketName + '/*']
                            }
                        ]
                    }
                } else if (policy == 'Private') {
                    // Private
                    policy = { Version: '2012-10-17', Statement: [] }
                } else if (policy == 'Custom') {
                    // Custom
                    let bucketAction = []
                    let objectAction = []
                    for (let i = 0; i < this.actionList.length; i++) {
                        if (this.actionList[i].indexOf('Bucket') > -1) {
                            bucketAction.push(this.actionList[i])
                        } else {
                            objectAction.push(this.actionList[i])
                        }
                    }
                    if (bucketAction.length === 0 && objectAction.length === 0) {
                        policy = { Version: '2012-10-17', Statement: [] }
                    } else if (bucketAction.length === 0) {
                        policy = {
                            Version: '2012-10-17',
                            Statement: [
                                {
                                    Effect: 'Allow',
                                    Principal: { AWS: ['*'] },
                                    Action: bucketAction,
                                    Resource: ['arn:aws:s3:::' + bucketName]
                                }
                            ]
                        }
                    } else if (objectAction.length === 0) {
                        policy = {
                            Version: '2012-10-17',
                            Statement: [
                                {
                                    Effect: 'Allow',
                                    Principal: { AWS: ['*'] },
                                    Action: objectAction,
                                    Resource: ['arn:aws:s3:::' + bucketName + '/*']
                                }
                            ]
                        }
                    } else {
                        policy = {
                            Version: '2012-10-17',
                            Statement: [
                                {
                                    Effect: 'Allow',
                                    Principal: { AWS: ['*'] },
                                    Action: bucketAction,
                                    Resource: ['arn:aws:s3:::' + bucketName]
                                },
                                {
                                    Effect: 'Allow',
                                    Principal: { AWS: ['*'] },
                                    Action: objectAction,
                                    Resource: ['arn:aws:s3:::' + bucketName + '/*']
                                }
                            ]
                        }
                    }
                }
                try {
                    await this.client.setBucketPolicy(bucketName, JSON.stringify(policy))
                } catch (err) {
                    this.$message.error(err.message)
                }
            }
        },
        async removeObject(bucketName, objectName) {
            try {
                await this.client.removeObject(bucketName, objectName)
            } catch (err) {
                this.$message.error(err.message)
            }
        },
        createFolder(bucketName, folderName) {
            this.client.putObject(bucketName, folderName + '/', '', err => {
                if (err) {
                    this.$message.error(err.message)
                } else {
                    this.listObjects(this.currentBucketName, this.currentPrefix)
                }
            })
        },
        async moveObject(sourceBucketName, objectsList, targetBucketName) {
            try {
                for (let i = 0; i < objectsList.length; i++) {
                    await this.client.copyObject(
                        targetBucketName,
                        objectsList[i],
                        '/' + sourceBucketName + '/' + objectsList[i]
                    )
                }
                await this.client.removeObjects(sourceBucketName, objectsList)
            } catch (err) {
                this.$message.error(err.message)
            }
        },
        async renameObject(bucketName, sourceObjectName, targetObjectName) {
            try {
                await this.client.copyObject(bucketName, targetObjectName, '/' + bucketName + '/' + sourceObjectName)
                await this.client.removeObject(bucketName, sourceObjectName)
            } catch (err) {
                this.$message.error(err.message)
            }
        },
        async getObject(bucketName, objectName) {
            let size = 0
            const dataStream = await this.client.getObject(bucketName, objectName)
            dataStream.on('data', chunk => {
                size += chunk.length
            })
            dataStream.on('end', () => {
                console.log('End. Total size = ' + size)
            })
            dataStream.on('error', err => {
                this.$message.error(err.message)
            })
        },
        putObject(bucketName, objectName, stream) {
            this.client.putObject(bucketName, objectName, stream, err => {
                if (err) {
                    this.$message.error(err.message)
                }
            })
        },
        async removeObject(bucketName, objectName) {
            try {
                await this.client.removeObject(bucketName, objectName)
                if (this.currentBucketName) {
                    this.listObjects(this.currentBucketName, this.currentPrefix)
                    this.$message.success('Objects deleted successfully.')
                }
            } catch (err) {
                this.$message.error(err.message)
            }
        },
        async removeObjects(bucketName, objectsList) {
            try {
                await this.client.removeObjects(bucketName, objectsList)
                if (this.currentBucketName) {
                    this.listObjects(this.currentBucketName, this.currentPrefix)
                    this.$message.success('Objects deleted successfully.')
                }
            } catch (err) {
                this.$message.error(err.message)
            }
        },
        async removeBucket(bucketName) {
            try {
                await this.client.removeBucket(bucketName)
            } catch (err) {
                this.$message.error(err.message)
            }
        },
        listObjects(bucketName, prefix, loading) {
            const data = []
            const stream = this.client.listObjectsV2(bucketName, prefix, false)
            stream.on('data', obj => {
                data.push(obj)
            })
            stream.on('end', () => {
                if (data.length === 1 && data[0].name === prefix) {
                    this.tableData = []
                } else {
                    this.tableData = data
                }
                this.$nextTick(() => {
                    if (loading) {
                        loading.close()
                    }
                })
                this.currentBucketName = bucketName
            })
            stream.on('error', err => {
                this.$message.error(err.message)
                this.$nextTick(() => {
                    if (loading) {
                        loading.close()
                    }
                })
            })
        },
        handleActivate() {
            if (this.licenseKey) {
                const client = new ClientJS()
                const params = {
                    product_id: 'Pigeon',
                    client_id: client.getFingerprint(),
                    license_code: this.licenseKey
                }
                this.$axios.get('verification_license', { params }).then(res => {
                    if (res.data.code == 200) {
                        this.isPay = true
                        localStorage.setItem('isPay', true)
                        this.licenseVisible = false
                    } else {
                        this.$message.error(res.data.msg)
                    }
                })
            }
        },
        async getAppPath() {
            let result = await window.ipcRenderer.invoke('getAppPath')
            this.appPath = result.appPath
        },
        async handleUpload() {
            if (this.isPay) {
                let filePaths = await window.ipcRenderer.invoke('dialog:openFile')
                if (filePaths) {
                    let appPath = await window.ipcRenderer.invoke('getAppPath')
                    let filesData = []
                    for (let i = 0; i < filePaths.length; i++) {
                        this.walkDir(filePaths[i], '', filesData, appPath.appPath)
                    }
                    this.notificationTitle = 'Uploads'
                    this.progressVisible = true
                    this.totalNumber = filesData.length
                    this.remainingNumber = filesData.length
                    this.percentage = 0
                    await Promise.all(filesData)
                    this.listObjects(this.currentBucketName, this.currentPrefix)
                    this.progressVisible = false
                    console.log('success')
                }
            } else {
                this.licenseKey = ''
                this.licenseVisible = true
            }
        },
        walkDir(dir, rootDir, filesData, appPath) {
            let lstatSync = fs.lstatSync(dir)
            if (lstatSync.isDirectory()) {
                if (!rootDir) {
                    rootDir = path.dirname(dir) + '/'
                }
                if (path.extname(dir) === '.app') {
                    let fileName = ''
                    if (rootDir) {
                        fileName = this.currentPrefix + dir.replace(rootDir, '')
                    } else {
                        fileName = this.currentPrefix + path.basename(dir)
                    }
                    filesData.push(this.limit(() => this.handleXhr(dir, fileName, true, appPath)))
                } else {
                    fs.readdirSync(dir).forEach(item => {
                        let fullPath = path.join(dir, item)
                        let stat = fs.lstatSync(fullPath)
                        if (stat.isDirectory()) {
                            if (path.extname(fullPath) === '.app') {
                                let fileName = ''
                                if (rootDir) {
                                    fileName = this.currentPrefix + fullPath.replace(rootDir, '')
                                } else {
                                    fileName = this.currentPrefix + path.basename(dir)
                                }
                                filesData.push(this.limit(() => this.handleXhr(fullPath, fileName, true, appPath)))
                            } else {
                                this.walkDir(fullPath, rootDir, filesData, appPath)
                            }
                        } else {
                            let fileName = ''
                            if (rootDir) {
                                fileName = this.currentPrefix + fullPath.replace(rootDir, '')
                            } else {
                                fileName = this.currentPrefix + path.basename(dir)
                            }
                            filesData.push(this.limit(() => this.handleXhr(fullPath, fileName, false, appPath)))
                        }
                    })
                }
            } else {
                let fileName = ''
                if (rootDir) {
                    fileName = dir.replace(rootDir, '')
                } else {
                    fileName = this.currentPrefix + path.basename(dir)
                }
                filesData.push(this.limit(() => this.handleXhr(dir, fileName, false, appPath)))
            }
        },
        handleSelectionChange(val) {
            this.multipleSelection = val
        },
        rowContextmenu(row, column, event) {
            event.preventDefault()
            this.currentRow = row
            if (this.currentBucketName) {
                this.panelValue = ''
                if (row.name) {
                    this.menuOptions = [
                        {
                            value: 'Share',
                            label: 'Share'
                        }
                    ]
                    this.$nextTick(() => {
                        let menu = document.getElementById('menu')
                        menu.style.left = event.clientX + 10 + 'px'
                        menu.style.top = event.clientY + 'px'
                        menu.style.display = 'block'
                        menu.style.zIndex = 10000
                    })
                }
            } else {
                if (row.creationDate) {
                    this.deleteBucketName = row.name.toString()
                }
                this.panelValue = ''
                this.menuOptions = [
                    {
                        value: 'Access Policy',
                        label: 'Access Policy'
                    },
                    {
                        value: 'Delete Bucket',
                        label: 'Delete Bucket'
                    }
                ]
                this.$nextTick(() => {
                    let menu = document.getElementById('menu')
                    menu.style.left = event.clientX + 10 + 'px'
                    menu.style.top = event.clientY + 'px'
                    menu.style.display = 'block'
                    menu.style.zIndex = 10000
                })
            }
        },
        handleProfileEdit(index) {
            this.profileVisible = true
            this.profileForm = JSON.parse(JSON.stringify(this.profiles[index]))
            this.currentIndex = index
        },
        handleProfileDelete(index) {
            this.profiles.splice(index, 1)
            localStorage.setItem('profiles', JSON.stringify(this.profiles))
            this.currentIndex = -1
            this.client = null
            this.currentBucketName = ''
            this.currentPrefix = ''
        },
        profileRowClick(row, column, event) {
            this.currentRow = row
            let index = this.profiles.indexOf(row)
            this.switchProfile(index)
        },
        handleCreateProfile() {
            this.profileVisible = true
            this.profileForm = {
                type: '',
                name: 'Account ' + (this.profiles.length + 1),
                endPoint: '',
                accessKey: '',
                secretKey: '',
                useSSL: true,
                pathStyle: true
            }
            this.currentIndex = -1
            this.client = null
        },
        saveProfile() {
            this.$refs.profile.validate(valid => {
                if (valid) {
                    this.addProfile()
                }
            })
        },
        async addProfile() {
            const loading = this.$loading({
                lock: true,
                text: 'Connecting',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.5)'
            })
            if (this.profileForm.type === 'aws') {
                try {
                    this.profileForm.endPoint = 's3.amazonaws.com'
                    this.client = new Minio.Client({
                        endPoint: 's3.amazonaws.com',
                        useSSL: true,
                        accessKey: this.profileForm.accessKey,
                        secretKey: this.profileForm.secretKey
                    })
                    const buckets = await this.client.listBuckets()
                    this.tableData = buckets
                    this.profileVisible = false
                    if (this.currentIndex === -1) {
                        this.profiles.push(JSON.parse(JSON.stringify(this.profileForm)))
                    } else {
                        this.$set(this.profiles, this.currentIndex, JSON.parse(JSON.stringify(this.profileForm)))
                    }
                    this.currentRow = JSON.parse(JSON.stringify(this.profileForm))
                    localStorage.setItem('profiles', JSON.stringify(this.profiles))
                    this.setCurrentRowHighlight(this.profiles.length - 1)
                    this.currentIndex = this.profiles.length - 1
                } catch (err) {
                    this.client = null
                    this.$message.error(err.message)
                }
            } else if (this.profileForm.type === 'minio') {
                try {
                    this.client = new Minio.Client({
                        endPoint: this.profileForm.endPoint,
                        port: parseInt(this.profileForm.port),
                        useSSL: this.profileForm.useSSL,
                        accessKey: this.profileForm.accessKey,
                        secretKey: this.profileForm.secretKey
                    })
                    const buckets = await this.client.listBuckets()
                    this.tableData = buckets
                    this.profileVisible = false
                    if (this.currentIndex === -1) {
                        this.profiles.push(JSON.parse(JSON.stringify(this.profileForm)))
                    } else {
                        this.$set(this.profiles, this.currentIndex, JSON.parse(JSON.stringify(this.profileForm)))
                    }
                    localStorage.setItem('profiles', JSON.stringify(this.profiles))
                    this.setCurrentRowHighlight(this.profiles.length - 1)
                    this.currentIndex = this.profiles.length - 1
                } catch (err) {
                    this.client = null
                    this.$message.error(err.message)
                }
            } else if (this.profileForm.type === 'oss') {
                try {
                    this.client = new Minio.Client({
                        endPoint: this.profileForm.endPoint,
                        useSSL: true,
                        accessKey: this.profileForm.accessKey,
                        secretKey: this.profileForm.secretKey,
                        pathStyle: false
                    })
                    const buckets = await this.client.listBuckets()
                    this.tableData = buckets
                    this.profileVisible = false
                    if (this.currentIndex === -1) {
                        this.profiles.push(JSON.parse(JSON.stringify(this.profileForm)))
                    } else {
                        this.$set(this.profiles, this.currentIndex, JSON.parse(JSON.stringify(this.profileForm)))
                    }
                    localStorage.setItem('profiles', JSON.stringify(this.profiles))
                    this.setCurrentRowHighlight(this.profiles.length - 1)
                    this.currentIndex = this.profiles.length - 1
                } catch (err) {
                    this.client = null
                    this.$message.error(err.message)
                }
            } else if (this.profileForm.type === 'cos') {
                try {
                    this.client = new Minio.Client({
                        endPoint: this.profileForm.endPoint,
                        useSSL: true,
                        accessKey: this.profileForm.accessKey,
                        secretKey: this.profileForm.secretKey,
                        pathStyle: false
                    })
                    const buckets = await this.client.listBuckets()
                    this.tableData = buckets
                    this.profileVisible = false
                    if (this.currentIndex === -1) {
                        this.profiles.push(JSON.parse(JSON.stringify(this.profileForm)))
                    } else {
                        this.$set(this.profiles, this.currentIndex, JSON.parse(JSON.stringify(this.profileForm)))
                    }
                    localStorage.setItem('profiles', JSON.stringify(this.profiles))
                    this.setCurrentRowHighlight(this.profiles.length - 1)
                    this.currentIndex = this.profiles.length - 1
                } catch (err) {
                    this.client = null
                    this.$message.error(err.message)
                }
            } else if (this.profileForm.type === 'b2') {
                try {
                    this.client = new Minio.Client({
                        endPoint: this.profileForm.endPoint,
                        useSSL: true,
                        accessKey: this.profileForm.accessKey,
                        secretKey: this.profileForm.secretKey
                    })
                    const buckets = await this.client.listBuckets()
                    this.tableData = buckets
                    this.profileVisible = false
                    if (this.currentIndex === -1) {
                        this.profiles.push(JSON.parse(JSON.stringify(this.profileForm)))
                    } else {
                        this.$set(this.profiles, this.currentIndex, JSON.parse(JSON.stringify(this.profileForm)))
                    }
                    this.currentRow = JSON.parse(JSON.stringify(this.profileForm))
                    localStorage.setItem('profiles', JSON.stringify(this.profiles))
                    this.setCurrentRowHighlight(this.profiles.length - 1)
                    this.currentIndex = this.profiles.length - 1
                } catch (err) {
                    this.client = null
                    this.$message.error(err.message)
                }
            } else if (this.profileForm.type === 'r2') {
                try {
                    this.client = new Minio.Client({
                        endPoint: this.profileForm.endPoint,
                        useSSL: true,
                        accessKey: this.profileForm.accessKey,
                        secretKey: this.profileForm.secretKey
                    })
                    const buckets = await this.client.listBuckets()
                    this.tableData = buckets
                    this.profileVisible = false
                    if (this.currentIndex === -1) {
                        this.profiles.push(JSON.parse(JSON.stringify(this.profileForm)))
                    } else {
                        this.$set(this.profiles, this.currentIndex, JSON.parse(JSON.stringify(this.profileForm)))
                    }
                    this.currentRow = JSON.parse(JSON.stringify(this.profileForm))
                    localStorage.setItem('profiles', JSON.stringify(this.profiles))
                    this.setCurrentRowHighlight(this.profiles.length - 1)
                    this.currentIndex = this.profiles.length - 1
                } catch (err) {
                    this.client = null
                    this.$message.error(err.message)
                }
            } else if (this.profileForm.type === 'other') {
                try {
                    this.client = new Minio.Client({
                        endPoint: this.profileForm.endPoint,
                        useSSL: this.profileForm.useSSL,
                        port: parseInt(this.profileForm.port),
                        accessKey: this.profileForm.accessKey,
                        secretKey: this.profileForm.secretKey,
                        pathStyle: this.profileForm.pathStyle
                    })
                    const buckets = await this.client.listBuckets()
                    this.tableData = buckets
                    this.profileVisible = false
                    if (this.currentIndex === -1) {
                        this.profiles.push(JSON.parse(JSON.stringify(this.profileForm)))
                    } else {
                        this.$set(this.profiles, this.currentIndex, JSON.parse(JSON.stringify(this.profileForm)))
                    }
                    this.currentRow = JSON.parse(JSON.stringify(this.profileForm))
                    localStorage.setItem('profiles', JSON.stringify(this.profiles))
                    this.setCurrentRowHighlight(this.profiles.length - 1)
                    this.currentIndex = this.profiles.length - 1
                } catch (err) {
                    this.client = null
                    this.$message.error(err.message)
                }
            }
            loading.close()
        },
        async switchProfile(index) {
            this.client = null
            this.currentBucketName = ''
            this.currentPrefix = ''
            let profile = this.profiles[index]
            const loading = this.$loading({
                lock: true,
                text: 'Connecting',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.5)'
            })
            if (profile.type === 'aws') {
                try {
                    this.client = new Minio.Client({
                        endPoint: profile.endPoint,
                        useSSL: true,
                        accessKey: profile.accessKey,
                        secretKey: profile.secretKey
                    })
                    const buckets = await this.client.listBuckets()
                    this.currentIndex = index
                    this.tableData = buckets
                    this.setCurrentRowHighlight(index)
                } catch (err) {
                    this.client = null
                    this.currentIndex = -1
                    this.tableData = []
                    this.$message.error(err.message)
                }
            } else if (profile.type === 'minio') {
                try {
                    this.client = new Minio.Client({
                        endPoint: profile.endPoint,
                        port: parseInt(profile.port),
                        useSSL: profile.useSSL,
                        accessKey: profile.accessKey,
                        secretKey: profile.secretKey
                    })
                    const buckets = await this.client.listBuckets()
                    this.currentIndex = index
                    this.tableData = buckets
                    this.setCurrentRowHighlight(index)
                } catch (err) {
                    this.client = null
                    this.currentIndex = -1
                    this.tableData = []
                    this.$message.error(err.message)
                }
            } else if (profile.type === 'oss') {
                try {
                    this.client = new Minio.Client({
                        endPoint: profile.endPoint,
                        useSSL: true,
                        accessKey: profile.accessKey,
                        secretKey: profile.secretKey,
                        pathStyle: false
                    })
                    const buckets = await this.client.listBuckets()
                    this.currentIndex = index
                    this.tableData = buckets
                    this.setCurrentRowHighlight(index)
                } catch (err) {
                    this.client = null
                    this.currentIndex = -1
                    this.tableData = []
                    this.$message.error(err.message)
                }
            } else if (profile.type === 'cos') {
                try {
                    this.client = new Minio.Client({
                        endPoint: profile.endPoint,
                        useSSL: true,
                        accessKey: profile.accessKey,
                        secretKey: profile.secretKey,
                        pathStyle: false
                    })
                    const buckets = await this.client.listBuckets()
                    this.currentIndex = index
                    this.tableData = buckets
                    this.setCurrentRowHighlight(index)
                } catch (err) {
                    this.client = null
                    this.currentIndex = -1
                    this.tableData = []
                    this.$message.error(err.message)
                }
            } else if (profile.type === 'b2') {
                try {
                    this.client = new Minio.Client({
                        endPoint: profile.endPoint,
                        useSSL: true,
                        accessKey: profile.accessKey,
                        secretKey: profile.secretKey
                    })
                    const buckets = await this.client.listBuckets()
                    this.currentIndex = index
                    this.tableData = buckets
                    this.setCurrentRowHighlight(index)
                } catch (err) {
                    this.client = null
                    this.currentIndex = -1
                    this.tableData = []
                    this.$message.error(err.message)
                }
            } else if (profile.type === 'r2') {
                try {
                    this.client = new Minio.Client({
                        endPoint: profile.endPoint,
                        useSSL: true,
                        accessKey: profile.accessKey,
                        secretKey: profile.secretKey
                    })
                    const buckets = await this.client.listBuckets()
                    this.currentIndex = index
                    this.tableData = buckets
                    this.setCurrentRowHighlight(index)
                } catch (err) {
                    this.client = null
                    this.currentIndex = -1
                    this.tableData = []
                    this.$message.error(err.message)
                }
            } else if (profile.type === 'other') {
                try {
                    this.client = new Minio.Client({
                        endPoint: profile.endPoint,
                        port: parseInt(profile.port),
                        useSSL: profile.useSSL,
                        accessKey: profile.accessKey,
                        secretKey: profile.secretKey,
                        pathStyle: profile.pathStyle
                    })
                    const buckets = await this.client.listBuckets()
                    this.currentIndex = index
                    this.tableData = buckets
                    this.setCurrentRowHighlight(index)
                } catch (err) {
                    this.client = null
                    this.currentIndex = -1
                    this.tableData = []
                    this.$message.error(err.message)
                }
            }
            loading.close()
        },
        setCurrentRowHighlight(index) {
            this.$nextTick(() => {
                this.$refs.profileTable.setCurrentRow(this.profiles[index])
            })
        },
        formatterIcon(row) {
            if (row.creationDate) {
                return '<img src="fileType/bucket.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
            } else if (!row.name) {
                return '<img src="fileType/folder.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
            } else {
                let type = mime.getType(row.name)
                if (
                    type === 'image/png' ||
                    type === 'image/jpeg' ||
                    type === 'image/webp' ||
                    type === 'image/bmp' ||
                    type === 'image/vnd.microsoft.icon'
                ) {
                    return '<img src="fileType/image.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else if (type === 'application/x-sql') {
                    return '<img src="fileType/sql.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else if (type === 'video/mp4') {
                    return '<img src="fileType/video.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else if (type === 'text/plain') {
                    return '<img src="fileType/txt.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else if (type === 'application/pdf') {
                    return '<img src="fileType/pdf.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else if (
                    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    type === 'application/msword'
                ) {
                    return '<img src="fileType/word.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else if (
                    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    type === 'application/vnd.ms-excel' ||
                    type === 'text/csv'
                ) {
                    return '<img src="fileType/excel.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else if (
                    type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                    type === 'application/vnd.ms-powerpoint'
                ) {
                    return '<img src="fileType/ppt.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else if (type === 'font/ttf' || type === 'image/tiff') {
                    return '<img src="fileType/tif.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else if (type === 'application/json') {
                    return '<img src="fileType/json.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else if (type === 'application/xml') {
                    return '<img src="fileType/xml.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else if (
                    type === 'application/zip' ||
                    type === 'application/gzip' ||
                    type === 'application/x-7z-compressed' ||
                    type === 'application/vnd.rar' ||
                    type === 'application/java-archive'
                ) {
                    return '<img src="fileType/zip.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else if (type === 'video/x-flv' || type === 'application/x-shockwave-flash') {
                    return '<img src="fileType/video.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else if (type === 'audio/mpeg') {
                    return '<img src="fileType/audio.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else if (type === 'application/vnd.android.package-archive') {
                    return '<img src="fileType/apk.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                } else {
                    let extname = path.extname(row.name)
                    if (extname === '.exe') {
                        return '<img src="fileType/exe.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                    } else if (extname === '.ofd') {
                        return '<img src="fileType/ofd.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                    } else {
                        return '<img src="fileType/other.svg" style="width: 20px; height: 20px; margin-right: 5px" />'
                    }
                }
            }
        },
        formatterName(row) {
            if (row.name) {
                return row.name.toString().replace(this.currentPrefix, '')
            } else if (row.prefix) {
                return row.prefix.replace(this.currentPrefix, '').replace('/', '')
            }
        },
        formatterLastModified(row) {
            if (row.creationDate) {
                return dayjs(row.creationDate).format('YYYY-MM-DD HH:mm:ss')
            } else if (row.lastModified) {
                return dayjs(row.lastModified).format('YYYY-MM-DD HH:mm:ss')
            }
            return '-'
        },
        formatterSize(row) {
            if (row.size) {
                const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
                const exponent = Math.min(Math.floor(Math.log(row.size) / Math.log(1024)), units.length - 1)
                const approx = row.size / 1024 ** exponent
                if (exponent == 0 || exponent == 1) {
                    return approx.toFixed(0) + ' ' + units[exponent]
                } else {
                    return approx.toFixed(1) + ' ' + units[exponent]
                }
            } else if (row.name && row.size === 0) {
                return '0B'
            } else {
                return '-'
            }
        },
        async bucketRowClick(row, column, event) {
            if (row.creationDate) {
                const loading = this.$loading({
                    lock: true,
                    text: 'Loading',
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.5)'
                })
                this.listObjects(row.name.toString(), row.prefix || '', loading)
            } else if (row.name && row.lastModified) {
                // open file
                let appPath = await window.ipcRenderer.invoke('getAppPath')
                let filePath =
                    appPath.appPath + '/' + this.currentRow.name + '/' + this.currentBucketName + '/' + row.name
                if (fs.existsSync(filePath)) {
                    await window.ipcRenderer.invoke('openPath', filePath)
                } else {
                    const dirPath = path.dirname(filePath)
                    fs.mkdirSync(dirPath, { recursive: true })
                    const ws = fs.createWriteStream(filePath)
                    const dataStream = await this.client.getObject(this.currentBucketName, row.name)
                    dataStream.on('data', chunk => {
                        ws.write(chunk)
                    })
                    dataStream.on('end', async () => {
                        ws.close()
                        await window.ipcRenderer.invoke('openPath', filePath)
                    })
                    dataStream.on('error', err => {
                        this.$message.error(err.message)
                    })
                }
            } else {
                const loading = this.$loading({
                    lock: true,
                    text: 'Loading',
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.5)'
                })
                this.currentPrefix = row.prefix || ''
                this.listObjects(this.currentBucketName, row.prefix || '', loading)
            }
        },
        jumpRoot() {
            this.currentPrefix = ''
            this.listObjects(this.currentBucketName, '')
        },
        jumpPath(index) {
            const loading = this.$loading({
                lock: true,
                text: 'Loading',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.5)'
            })
            let prefixArray = this.currentPrefix.split('/')
            let prefix = prefixArray.slice(0, index + 1).join('/') + '/'
            this.currentPrefix = prefix
            this.listObjects(this.currentBucketName, prefix, loading)
        },
        handleSelectProfile() {
            this.profileVisible = false
        },
        showNewBucket() {
            this.bucketVisible = true
            this.bucketName = ''
            this.policy = 'Private'
            this.actionList = []
        },
        handleNewBucket() {
            this.makeBucket(this.bucketName, this.policy)
        },
        showNewFolder() {
            if (this.isPay) {
                this.folderVisible = true
                this.folderName = ''
            } else {
                this.licenseKey = ''
                this.licenseVisible = true
            }
        },
        handleNewFolder() {
            this.createFolder(this.currentBucketName, this.currentPrefix + this.folderName)
            this.folderVisible = false
        },
        handleDelete() {
            if (this.isPay) {
                if (this.currentBucketName) {
                    this.$confirm(
                        'Are you sure you want to delete the selected ' + this.multipleSelection.length + ' objects?',
                        'Delete Objects',
                        {
                            confirmButtonText: 'Delete',
                            cancelButtonClass: 'cancelButtonClass',
                            confirmButtonClass: 'confirmButtonClass',
                            cancelButtonText: 'Cancel'
                        }
                    )
                        .then(async () => {
                            const loading = this.$loading({
                                lock: true,
                                text: 'Loading Objects Total',
                                spinner: 'el-icon-loading',
                                background: 'rgba(0, 0, 0, 0.5)'
                            })
                            let objectsList = []
                            await Promise.all([this.listObjectsTotal(objectsList)])
                            loading.close()
                            this.notificationTitle = 'Deletes'
                            this.progressVisible = true
                            this.totalNumber = objectsList.length
                            this.remainingNumber = objectsList.length
                            this.percentage = 0
                            let chunkSize = 0
                            if (objectsList.length < 1000) {
                                chunkSize = 100
                            } else {
                                chunkSize = 1000
                            }
                            let deleteData = []
                            for (let i = 0; i < objectsList.length; i += chunkSize) {
                                deleteData.push(
                                    this.limit(() =>
                                        this.batchRemoveObjects(
                                            this.currentBucketName,
                                            objectsList.slice(i, i + chunkSize)
                                        )
                                    )
                                )
                            }
                            await Promise.all(deleteData)
                            this.listObjects(this.currentBucketName, this.currentPrefix)
                            this.progressVisible = false
                        })
                        .catch(() => {})
                } else {
                    for (let i = 0; i < this.multipleSelection.length; i++) {
                        let item = this.multipleSelection[i]
                        const objectsList = []
                        const stream = this.client.listObjectsV2(item.name.toString(), '', true)
                        stream.on('data', obj => {
                            objectsList.push(obj.name)
                        })
                        stream.on('end', () => {
                            this.removeObjects(item.name.toString(), objectsList)
                            this.removeBucket(item.name.toString())
                        })
                        stream.on('error', err => {
                            this.$message.error(err.message)
                        })
                    }
                }
            } else {
                this.licenseKey = ''
                this.licenseVisible = true
            }
        },
        async batchRemoveObjects(bucketName, objectsList) {
            try {
                await this.client.removeObjects(bucketName, objectsList)
                this.remainingNumber = this.remainingNumber - objectsList.length
                this.percentage = parseInt(((this.totalNumber - this.remainingNumber) * 100) / this.totalNumber)
            } catch (err) {
                this.$message.error(err.message)
            }
        },
        async getDesktopPath() {
            let result = await window.ipcRenderer.invoke('getDesktopPath')
            this.downloadDir = result
        },
        async handleDownload() {
            if (this.isPay) {
                let result = await window.ipcRenderer.invoke('getDesktopPath')
                this.downloadDir = result
                let objectsList = []
                await Promise.all([this.listObjectsTotal(objectsList)])
                this.notificationTitle = 'Downloads'
                this.progressVisible = true
                this.totalNumber = objectsList.length
                this.remainingNumber = objectsList.length
                this.percentage = 0
                for (let i = 0; i < objectsList.length; i++) {
                    const dirPath = path.dirname(this.downloadDir + '/' + objectsList[i])
                    fs.mkdirSync(dirPath, { recursive: true })
                    const ws = fs.createWriteStream(this.downloadDir + '/' + objectsList[i])
                    const dataStream = await this.client.getObject(this.currentBucketName, objectsList[i])
                    dataStream.on('data', chunk => {
                        ws.write(chunk)
                    })
                    dataStream.on('end', () => {
                        this.remainingNumber = this.remainingNumber - 1
                        this.percentage = parseInt(((this.totalNumber - this.remainingNumber) * 100) / this.totalNumber)
                        ws.close()
                        if (i === objectsList.length - 1) {
                            this.progressVisible = false
                        }
                    })
                    dataStream.on('error', err => {
                        this.$message.error(err.message)
                    })
                }
            } else {
                this.licenseKey = ''
                this.licenseVisible = true
            }
        },
        listObjectsTotal(objectsList) {
            for (let i = 0; i < this.multipleSelection.length; i++) {
                let item = this.multipleSelection[i]
                if (item.name) {
                    objectsList.push(item.name)
                } else if (item.prefix) {
                    return new Promise((resolve, reject) => {
                        const stream = this.client.listObjectsV2(this.currentBucketName, item.prefix, true)
                        stream.on('data', obj => {
                            objectsList.push(obj.name)
                        })
                        stream.on('end', () => {
                            resolve()
                        })
                        stream.on('error', err => {
                            this.$message.error(err.message)
                            reject()
                        })
                    })
                }
            }
            return objectsList
        },
        async menuChange(value) {
            if (this.isPay) {
                if (value === 'Delete Bucket') {
                    this.confirmVisible = true
                    this.deleteWord = ''
                } else if (value === 'Access Policy') {
                    try {
                        const policy = await this.client.getBucketPolicy(this.deleteBucketName)
                        const bucketPolicy = JSON.parse(policy)
                        if (bucketPolicy.Statement.length === 0) {
                            this.policy = 'Private'
                        } else {
                            let publicBucketAction = [
                                's3:GetBucketLocation',
                                's3:ListBucket',
                                's3:ListBucketMultipartUploads'
                            ]
                            let publicObjectAction = [
                                's3:AbortMultipartUpload',
                                's3:DeleteObject',
                                's3:GetObject',
                                's3:ListMultipartUploadParts',
                                's3:PutObject'
                            ]
                            let actionList = []
                            let bucketAction = []
                            let objectAction = []
                            for (let i = 0; i < bucketPolicy.Statement.length; i++) {
                                let statement = bucketPolicy.Statement[i]
                                actionList = actionList.concat(statement.Action)
                                if (statement.Resource[0] === 'arn:aws:s3:::' + this.deleteBucketName) {
                                    bucketAction = statement.Action
                                } else if (statement.Resource[0] === 'arn:aws:s3:::' + this.deleteBucketName + '/*') {
                                    objectAction = statement.Action
                                }
                            }
                            if (
                                publicBucketAction.sort().join('') === bucketAction.sort().join('') &&
                                publicObjectAction.sort().join('') === objectAction.sort().join('')
                            ) {
                                this.policy = 'Public'
                            } else {
                                this.policy = 'Custom'
                                this.actionList = actionList
                            }
                        }
                        this.policyVisible = true
                    } catch (err) {
                        this.$message.error(err.message)
                    }
                } else if (value === 'Delete Object') {
                    let item = this.currentRow
                    if (item.name) {
                        this.removeObject(this.currentBucketName, item.name)
                    } else if (item.prefix) {
                        const objectsList = []
                        const stream = this.client.listObjectsV2(this.currentBucketName, item.prefix, true)
                        stream.on('data', obj => {
                            objectsList.push(obj.name)
                        })
                        stream.on('end', () => {
                            this.removeObjects(this.currentBucketName, objectsList)
                        })
                        stream.on('error', err => {
                            this.$message.error(err.message)
                        })
                    }
                } else if (value === 'Download') {
                } else if (value === 'Share') {
                    try {
                        let presignedUrl = await this.client.presignedUrl(
                            'GET',
                            this.currentBucketName,
                            this.currentRow.name,
                            24 * 60 * 60 * 7
                        )
                        await navigator.clipboard.writeText(presignedUrl)
                        this.$message({
                            message: 'Copied',
                            type: 'success'
                        })
                    } catch (err) {
                        console.error(err)
                    }
                }
            } else {
                this.licenseKey = ''
                this.licenseVisible = true
            }
        },
        async handleDeleteBucket() {
            try {
                await this.client.removeBucket(this.deleteBucketName)
                this.confirmVisible = false
                this.listBuckets()
            } catch (err) {
                this.confirmVisible = false
                this.deleteBucketVisible = true
                this.deleteWord = ''
            }
        },
        listBucketObjectsTotal(objectsList) {
            return new Promise((resolve, reject) => {
                const stream = this.client.listObjectsV2(this.deleteBucketName, '', true)
                stream.on('data', obj => {
                    objectsList.push(obj.name)
                })
                stream.on('end', () => {
                    resolve()
                })
                stream.on('error', err => {
                    this.$message.error(err.message)
                    reject()
                })
            })
            return objectsList
        },
        async handleDeleteEverything() {
            this.deleteBucketVisible = false
            const loading = this.$loading({
                lock: true,
                text: 'Loading Objects Total',
                spinner: 'el-icon-loading',
                background: 'rgba(0, 0, 0, 0.5)'
            })
            let objectsList = []
            await Promise.all([this.listBucketObjectsTotal(objectsList)])
            loading.close()
            this.notificationTitle = 'Deletes'
            this.progressVisible = true
            this.totalNumber = objectsList.length
            this.remainingNumber = objectsList.length
            this.percentage = 0
            let chunkSize = 0
            if (objectsList.length < 1000) {
                chunkSize = 100
            } else {
                chunkSize = 1000
            }
            let deleteData = []
            for (let i = 0; i < objectsList.length; i += chunkSize) {
                deleteData.push(
                    this.limit(() =>
                        this.batchRemoveObjects(this.deleteBucketName, objectsList.slice(i, i + chunkSize))
                    )
                )
            }
            await Promise.all(deleteData)
            await this.removeBucket(this.deleteBucketName)
            await this.listBuckets()
            this.progressVisible = false
        },
        handleXhr(fullPath, fileName, macApp, appPath) {
            // const presignedUrl = await this.client.presignedPutObject(
            //     this.currentBucketName,
            //     fileName,
            //     24 * 60 * 60
            // )
            // const xhr = new XMLHttpRequest()
            // xhr.open('PUT', presignedUrl, false)
            // xhr.setRequestHeader('Content-Type', mime.getType(fullPath))
            // xhr.upload.onprogress = event => {
            //     if (event.lengthComputable) {
            //         var percentComplete = (event.loaded / event.total) * 100
            //         console.log(percentComplete.toFixed(2) + '%')
            //     }
            // }
            // xhr.onload = () => {
            //     if (xhr.status === 200 || xhr.status === 204) {
            //         console.log(`[${xhr.status}] ${fullPath} success`)
            //     } else {
            //         this.$message.error(`err status:${xhr.status} ${fullPath}`)
            //     }
            // }
            // let data = fs.readFileSync(fullPath)
            // xhr.send(data)
            //const fileStream = fs.createReadStream(fullPath)
            return new Promise((resolve, reject) => {
                if (macApp) {
                    let zipPath = appPath + '/' + path.basename(fullPath) + '.zip'
                    let zip = new AdmZip()
                    zip.addLocalFolder(fullPath, path.basename(fullPath))
                    zip.writeZip(zipPath)
                    this.client.fPutObject(this.currentBucketName, fileName + '.zip', zipPath, (err, etag) => {
                        this.remainingNumber = this.remainingNumber - 1
                        this.percentage = parseInt(((this.totalNumber - this.remainingNumber) * 100) / this.totalNumber)
                        if (err) {
                            reject()
                        } else {
                            resolve()
                        }
                        fs.unlinkSync(zipPath)
                    })
                } else {
                    this.client.fPutObject(this.currentBucketName, fileName, fullPath, (err, etag) => {
                        this.remainingNumber = this.remainingNumber - 1
                        this.percentage = parseInt(((this.totalNumber - this.remainingNumber) * 100) / this.totalNumber)
                        if (err) {
                            reject()
                        } else {
                            resolve()
                        }
                    })
                }
            })
        },
        handleType(value) {
            this.$refs.profile.clearValidate()
            if (value === 'oss') {
                this.profileForm.endPoint = 'oss-cn-beijing.aliyuncs.com'
            } else if (value === 'cos') {
                this.profileForm.endPoint = 'cos.ap-guangzhou.myqcloud.com'
            } else if (value === 'minio') {
                this.profileForm.useSSL = false
            } else {
                this.profileForm.endPoint = ''
                this.profileForm.useSSL = true
            }
        },
        async setPolicy() {
            let policy = {}
            if (this.policy == 'Public') {
                // Public
                let bucketAction = [
                    's3:CreateBucket',
                    's3:GetBucketLocation',
                    's3:ListBucket',
                    's3:ListBucketMultipartUploads'
                ]
                let objectAction = [
                    's3:GetObject',
                    's3:PutObject',
                    's3:DeleteObject',
                    's3:ListMultipartUploadParts',
                    's3:AbortMultipartUpload'
                ]
                policy = {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: { AWS: ['*'] },
                            Action: bucketAction,
                            Resource: ['arn:aws:s3:::' + this.deleteBucketName]
                        },
                        {
                            Effect: 'Allow',
                            Principal: { AWS: ['*'] },
                            Action: objectAction,
                            Resource: ['arn:aws:s3:::' + this.deleteBucketName + '/*']
                        }
                    ]
                }
            } else if (this.policy == 'Private') {
                // Private
                policy = { Version: '2012-10-17', Statement: [] }
            } else if (this.policy == 'Custom') {
                // Custom
                let bucketAction = []
                let objectAction = []
                for (let i = 0; i < this.actionList.length; i++) {
                    if (this.actionList[i].indexOf('Bucket') > -1) {
                        bucketAction.push(this.actionList[i])
                    } else {
                        objectAction.push(this.actionList[i])
                    }
                }
                if (bucketAction.length === 0 && objectAction.length === 0) {
                    policy = { Version: '2012-10-17', Statement: [] }
                } else if (bucketAction.length === 0) {
                    policy = {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Principal: { AWS: ['*'] },
                                Action: bucketAction,
                                Resource: ['arn:aws:s3:::' + this.deleteBucketName]
                            }
                        ]
                    }
                } else if (objectAction.length === 0) {
                    policy = {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Principal: { AWS: ['*'] },
                                Action: objectAction,
                                Resource: ['arn:aws:s3:::' + this.deleteBucketName + '/*']
                            }
                        ]
                    }
                } else {
                    policy = {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Principal: { AWS: ['*'] },
                                Action: bucketAction,
                                Resource: ['arn:aws:s3:::' + this.deleteBucketName]
                            },
                            {
                                Effect: 'Allow',
                                Principal: { AWS: ['*'] },
                                Action: objectAction,
                                Resource: ['arn:aws:s3:::' + this.deleteBucketName + '/*']
                            }
                        ]
                    }
                }
            }
            try {
                await this.client.setBucketPolicy(this.deleteBucketName, JSON.stringify(policy))
                this.policyVisible = false
            } catch (err) {
                this.$message.error(err.message)
            }
        },
        async handleShare() {
            try {
                let presignedUrl = await this.client.presignedUrl(
                    'GET',
                    this.currentBucketName,
                    this.multipleSelection[0].name,
                    24 * 60 * 60 * 7
                )
                await navigator.clipboard.writeText(presignedUrl)
                this.$message({
                    message: 'Copied',
                    type: 'success'
                })
            } catch (err) {
                console.error(err)
            }
        }
    }
}
</script>

<style scoped>
.flex-container {
    width: 100%;
    display: flex;
    padding: 15px 0px 15px 15px;
    box-sizing: border-box;
    background-color: #f3f1f2;
}
.profile {
    border-radius: 8px;
    width: 875px;
    height: 650px;
    color: #272727;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    background-color: #e2e0e2;
}
::v-deep .el-input.is-disabled .el-input__inner {
    background-color: #f3f1f2;
}
::v-deep .el-input__inner {
    padding: 0 7.7px;
    background-color: #f3f1f2;
}
::v-deep .el-input-group__append {
    background-color: #f3f1f2;
    padding: 0 8px;
}
::v-deep .el-input.is-disabled .el-input__inner {
    color: #606266;
}
::v-deep .el-select {
    width: 100%;
}
::v-deep .el-slider__bar {
    background-color: #272727;
}
::v-deep .el-select .el-input__inner:focus {
    border-color: #272727;
}
::v-deep .el-button--primary {
    background-color: #272727;
    border-color: #272727;
}
::v-deep .el-input__inner:focus {
    border-color: #272727;
}
::v-deep .el-button--primary.is-disabled:hover {
    background-color: #909399;
    border-color: #909399;
}
::v-deep .el-button--default {
    border: 1px solid #272727;
    color: #272727;
}
::v-deep .el-button--small {
    border-radius: 6px;
}
::v-deep .el-form-item__label {
    line-height: 26px;
    padding: 0px;
    font-size: 13px;
}
::v-deep .el-form-item {
    margin-top: 12px;
    margin-bottom: 0px;
}
::v-deep .el-input__inner::placeholder {
    font-size: 12px;
}
::v-deep .el-select-dropdown__item.selected {
    color: #272727;
}
::v-deep .el-button:active {
    color: #272727;
    border-color: #272727;
}
::v-deep .el-button--default:hover {
    color: #272727;
    border-color: #272727;
    background-color: #fff;
}
::v-deep .el-table__cell {
    padding: 8px 0;
}
::v-deep .el-checkbox__input.is-checked .el-checkbox__inner {
    background-color: #272727;
    border-color: #272727;
}
::v-deep .el-checkbox__inner {
    border-color: #272727 !important;
}
::v-deep .el-checkbox__inner:hover {
    border-color: #272727;
}
::v-deep .el-table td.el-table__cell {
    border-bottom: 1px solid #eaeaea;
}
::v-deep .el-checkbox__input.is-checked .el-checkbox__inner,
::v-deep .el-checkbox__input.is-indeterminate .el-checkbox__inner {
    background-color: #272727;
    border-color: #272727;
}
::v-deep .el-input--medium {
    font-size: 12px;
}
::v-deep .el-dialog__body {
    padding: 0px 20px 10px 20px;
}
::v-deep .el-checkbox__input.is-checked .el-checkbox__inner {
    background-color: #272727;
    border-color: #272727;
}
::v-deep .el-checkbox__inner:hover {
    border-color: #272727;
}
::v-deep .el-checkbox {
    color: #272727;
    font-weight: 400;
}
::v-deep .el-checkbox__label {
    font-size: 12px;
}
::v-deep .el-checkbox__input.is-checked + .el-checkbox__label {
    color: #272727;
}
::v-deep .el-cascader-menu {
    min-width: auto;
}
::v-deep .el-cascader-menu__wrap {
    width: auto;
    height: auto;
}
::v-deep .el-cascader-node.is-active {
    color: #272727;
}
::v-deep .el-cascader-node.in-active-path {
    color: #272727;
}
::v-deep .el-cascader-panel.is-bordered {
    border-radius: 8px;
    background: #fff;
}
::v-deep .el-cascader-node {
    padding: 0 10px 0 10px !important;
}
::v-deep .el-breadcrumb__inner {
    cursor: pointer !important;
}
::v-deep .el-switch.is-checked .el-switch__core {
    border-color: #272727;
    background-color: #272727;
}
::v-deep .el-select .el-input.is-focus .el-input__inner {
    border-color: #272727;
}
::v-deep .el-select-dropdown.is-multiple .el-select-dropdown__item.selected {
    color: #272727;
}
</style>
